import { Alert, Group, Loader, Table, Text } from '@mantine/core';
import * as React from 'react';

import { readableDateWithYear } from 'shared/time';
import { Currency } from 'shared/types';
import { countryCodeToFlag } from 'shared/util';
import { useCurrencyRates } from 'client/data/useCurrencyRates';

import { Caption } from '../design/Text';
import { InfoSection } from './InfoLayoutElements';

export const CurrencyRatesView: React.FC<{ currencies: Currency[] }> = ({ currencies }) => {
  const { rates, rateFor, isPending, isError } = useCurrencyRates();

  return (
    <InfoSection
      title="Valuuttakurssit"
      caption={
        rates
          ? `Euroopan keskuspankin viitekurssit ${readableDateWithYear(rates.date)}, yksikköä per 1 €`
          : 'Euroopan keskuspankin viitekurssit'
      }
    >
      {isPending ? (
        <Group justify="center" py="md">
          <Loader size="sm" />
        </Group>
      ) : isError ? (
        <Alert color="red" variant="light">
          Valuuttakursseja ei saatu haettua
        </Alert>
      ) : (
        <Table highlightOnHover layout="fixed">
          <Table.Tbody>
            {currencies.map(c => (
              <CurrencyRateRow key={c.id} currency={c} rate={rateFor(c.code)} />
            ))}
          </Table.Tbody>
        </Table>
      )}
    </InfoSection>
  );
};

const CurrencyRateRow: React.FC<{ currency: Currency; rate: string | undefined }> = ({
  currency,
  rate,
}) => (
  <Table.Tr>
    <Table.Td w={70}>
      <Group gap="xs" wrap="nowrap">
        <Text component="span">{countryCodeToFlag(currency.countryCode)}</Text>
        <Text component="span" fw={600}>
          {currency.code}
        </Text>
      </Group>
    </Table.Td>
    <Table.Td>{currency.name}</Table.Td>
    <Table.Td w={110} ta="right">
      {/* A currency can be listed here but absent from the ECB feed */}
      {rate ? <Text fw="bold">{rate}</Text> : <Caption>–</Caption>}
    </Table.Td>
    <Table.Td w={40}>
      <Caption>{currency.symbol}</Caption>
    </Table.Td>
  </Table.Tr>
);
