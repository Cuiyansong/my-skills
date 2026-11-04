import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import java.sql.Connection;
import java.sql.SQLException;

@Service
public class TransactionService {

    private final Connection connection;

    public TransactionService(Connection connection) {
        this.connection = connection;
    }

    @Transactional
    public void transferMoney(Long fromAccountId, Long toAccountId, Double amount) {
        try {
            connection.setAutoCommit(false);

            Account fromAccount = accountRepository.findById(fromAccountId);
            Account toAccount = accountRepository.findById(toAccountId);

            if (fromAccount.getBalance() < amount) {
                throw new InsufficientBalanceException("余额不足");
            }

            fromAccount.setBalance(fromAccount.getBalance() - amount);
            toAccount.setBalance(toAccount.getBalance() + amount);

            accountRepository.save(fromAccount);
            accountRepository.save(toAccount);

            connection.commit();
        } catch (SQLException e) {
            try {
                connection.rollback();
            } catch (SQLException ex) {
                ex.printStackTrace();
            }
            throw new TransactionException("转账失败", e);
        }
    }
}